import {
	ACESFilmicToneMapping,
	AmbientLight,
	Box3,
	Color,
	DirectionalLight,
	Group,
	Mesh,
	MeshStandardMaterial,
	PerspectiveCamera,
	PMREMGenerator,
	PointLight,
	Scene,
	SRGBColorSpace,
	Texture,
	Vector3,
	WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// the cakes, loaded from the fbx files in /public/models. each carries its own colour atlas, so
// the job here is to light them honestly rather than to paint them: correct colour space, filmic
// tone mapping, and one lime rim light that ties them back to the app.

// the flame is its own mesh in every one of these exports, and all meshes share a single material —
// so the candle has to be recognised by object name, never by material name
const FLAME_MESH_SUFFIX = '_candle_fire';
const LIME = 0xbbfa0d;
const FLAME_COLOR = 0xffc760;
// fbx units are anyone's guess (these measure ~80 across), so each model is scaled to fit the frame
const TARGET_SIZE = 1.7;

const BASE_SPIN = 0.3;
// how fast a poke bleeds off, and how much of it turns into spin, lift and flare
const POKE_DECAY = 2.6;
const POKE_SPIN = 9;
const POKE_LIFT = 0.25;
const MAX_FRAME_SECONDS = 0.1;

type Disposable = { dispose: () => void };

export type DecorationScene = {
	dispose: () => void;
	poke: (strength?: number) => void;
	render: (elapsedSeconds: number) => void;
	resize: (width: number, height: number) => void;
};

// the loader hands back one shared phong material pointing at an srgb atlas. every mesh gets its
// own standard copy: they react to the environment map, and the flame needs to glow alone.
function adoptMaterial(material: MeshStandardMaterial, isFlame: boolean, track: Disposable[]): MeshStandardMaterial {
	const source = material as unknown as { color?: Color; map?: null | Texture };
	const map = source.map ?? null;

	if (map) {
		map.colorSpace = SRGBColorSpace;
	}

	const next = new MeshStandardMaterial({
		color: source.color?.clone() ?? new Color(0xffffff),
		emissive: isFlame ? new Color(FLAME_COLOR) : new Color(0x000000),
		emissiveIntensity: isFlame ? 2.2 : 0,
		emissiveMap: isFlame ? map : null,
		map,
		metalness: 0,
		roughness: isFlame ? 0.4 : 0.72,
	});

	track.push(next);

	return next;
}

// centre the model on its own origin and fit it to the frame. the widest extent sets the scale,
// not the height: a whole cake is far broader than a slice and would otherwise overflow as it turns.
function normalize(model: Group): void {
	const box = new Box3().setFromObject(model);
	const size = box.getSize(new Vector3());
	const scale = TARGET_SIZE / Math.max(size.x, size.y, size.z, 0.0001);

	model.scale.setScalar(scale);

	const scaled = new Box3().setFromObject(model);
	const center = scaled.getCenter(new Vector3());

	model.position.set(-center.x, -center.y, -center.z);
}

// one call builds the whole thing and hands back the verbs a canvas needs: render, resize, poke,
// dispose. the caller owns the animation loop, so react never has to know what three.js is.
export function createCakeScene(
	modelUrl: string,
	canvas: HTMLCanvasElement,
	width: number,
	height: number
): DecorationScene {
	const track: Disposable[] = [];
	const renderer = new WebGLRenderer({ alpha: true, antialias: true, canvas });

	renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
	renderer.setSize(width, height, false);
	// without a tone map the atlas blows out into pastel; aces keeps the highlights in range
	renderer.toneMapping = ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.85;

	const scene = new Scene();
	const camera = new PerspectiveCamera(32, width / Math.max(height, 1), 0.1, 100);

	// far enough back that the widest cake still clears the frame while it drifts, tilts and hops
	camera.position.set(0, 0.55, 6.8);
	camera.lookAt(0, 0, 0);

	const pmrem = new PMREMGenerator(renderer);
	const room = new RoomEnvironment();
	const environment = pmrem.fromScene(room, 0.04);

	scene.environment = environment.texture;
	scene.environmentIntensity = 0.55;
	room.dispose();
	pmrem.dispose();
	// the render target owns the texture, so disposing it releases both
	track.push(environment);

	// drift carries the cake across the frame, pivot spins it underneath. two objects, so the
	// travel and the turn never fight over the same transform.
	const drift = new Group();
	const pivot = new Group();

	drift.add(pivot);
	scene.add(drift);

	scene.add(new AmbientLight(0xffffff, 0.9));

	const keyLight = new DirectionalLight(0xffffff, 1.6);

	keyLight.position.set(2.5, 4, 3);
	scene.add(keyLight);

	// a lime rim light from behind: the app's accent shows up as an edge rather than as paint
	const rimLight = new DirectionalLight(LIME, 1.4);

	rimLight.position.set(-3, 1.5, -2.5);
	scene.add(rimLight);

	const candleLight = new PointLight(FLAME_COLOR, 1.6, 5, 2);

	candleLight.position.set(0, 1, 0);
	scene.add(candleLight);

	let flameMaterial: MeshStandardMaterial | null = null;
	let disposed = false;
	let spin = 0;
	let pokeEnergy = 0;
	let lastElapsed = 0;

	void new FBXLoader().loadAsync(modelUrl).then((model) => {
		if (disposed) {
			return;
		}

		model.traverse((child) => {
			if (!(child instanceof Mesh)) {
				return;
			}

			const isFlame = child.name.endsWith(FLAME_MESH_SUFFIX);
			const materials = Array.isArray(child.material) ? child.material : [child.material];
			const adopted = materials.map((material) =>
				adoptMaterial(material as MeshStandardMaterial, isFlame, track)
			);

			child.material = adopted.length === 1 ? adopted[0]! : adopted;
			track.push(child.geometry);

			if (isFlame) {
				flameMaterial = adopted[0] ?? null;
			}
		});

		normalize(model);
		pivot.add(model);
	});

	return {
		dispose: () => {
			disposed = true;

			for (const item of track) {
				item.dispose();
			}

			renderer.dispose();
		},
		// a touch adds energy: the cake spins up, hops, and the candle flares, then it all bleeds off
		poke: (strength = 1) => {
			pokeEnergy = Math.min(pokeEnergy + strength, 2.2);
		},
		render: (elapsedSeconds) => {
			const delta = Math.min(Math.max(elapsedSeconds - lastElapsed, 0), MAX_FRAME_SECONDS);

			lastElapsed = elapsedSeconds;
			pokeEnergy *= Math.exp(-delta * POKE_DECAY);

			// a diagonal drift rather than a turntable: x and y ride the same slow wave, one lagging
			// the other, so the cake travels corner to corner instead of only spinning in place
			const travel = elapsedSeconds * 0.42;

			drift.position.set(Math.sin(travel) * 0.42, Math.sin(travel + 0.9) * 0.22 + pokeEnergy * POKE_LIFT, 0);

			spin += (BASE_SPIN + pokeEnergy * POKE_SPIN) * delta;
			pivot.rotation.y = spin;
			// a lean that follows the drift, plus a slow nod: the turn reads as tumbling, not rotating
			pivot.rotation.z = Math.sin(travel) * 0.16 - pokeEnergy * 0.12;
			pivot.rotation.x = Math.sin(travel * 1.3 + 1.2) * 0.1;

			// squash and stretch, so a poke has weight
			const stretch = 1 + pokeEnergy * 0.1;

			pivot.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));

			// the flicker is two sines at odd frequencies, so it never settles into a visible loop
			const flicker = 1 + Math.sin(elapsedSeconds * 11) * 0.1 + Math.sin(elapsedSeconds * 6.3) * 0.06;
			const flare = flicker * (1 + pokeEnergy * 1.6);

			candleLight.intensity = 1.6 * flare;
			candleLight.position.set(drift.position.x, drift.position.y + 1, 0);

			if (flameMaterial) {
				flameMaterial.emissiveIntensity = 2.2 * flare;
			}

			renderer.render(scene, camera);
		},
		resize: (nextWidth, nextHeight) => {
			camera.aspect = nextWidth / Math.max(nextHeight, 1);
			camera.updateProjectionMatrix();
			renderer.setSize(nextWidth, nextHeight, false);
		},
	};
}

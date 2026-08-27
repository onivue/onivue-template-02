import { handleMcpRequest } from '@/lib/mcp/mcp-handler';

export async function GET(request: Request): Promise<Response> {
	return handleMcpRequest(request);
}

export async function POST(request: Request): Promise<Response> {
	return handleMcpRequest(request);
}

export async function DELETE(request: Request): Promise<Response> {
	return handleMcpRequest(request);
}

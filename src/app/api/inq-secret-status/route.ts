import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const environment = searchParams.get('env');
  
  if (!environment) {
    return NextResponse.json({ error: 'Environment parameter is required' }, { status: 400 });
  }

  // Check if the client secret environment variable exists
  const envVarName = `INQ_CLIENT_SECRET_${environment.toUpperCase()}`;
  const hasSecret = !!process.env[envVarName];

  return NextResponse.json({ 
    hasSecret,
    environment,
    envVarName 
  });
}

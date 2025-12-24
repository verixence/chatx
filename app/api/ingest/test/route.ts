import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Test route works!" })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: "POST works!", body: await req.text() })
}


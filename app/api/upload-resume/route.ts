import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("UPLOAD RESUME API BODY:", body);

    if (!body.text) {
      return NextResponse.json(
        { error: "No text received" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      extractedText: body.text,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(request) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("audio");

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = "Please provide an accurate text transcript of this audio file. Output only the transcription text, nothing else.";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: file.type || "audio/mpeg",
                    data: base64Audio,
                },
            },
        ]);

        const transcriptText = result.response.text();

        const savedTranscript = await prisma.transcript.create({
            data: {
                text: transcriptText,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true, transcript: savedTranscript });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";

export async function POST(request) {
    try {
        const { email, password, name } = await request.json();

        const user = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
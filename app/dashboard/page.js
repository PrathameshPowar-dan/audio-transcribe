"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const [transcripts, setTranscripts] = useState([]);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/");
        }
    }, [session, isPending, router]);

    const fetchTranscripts = async () => {
        const res = await fetch("/api/transcripts");
        if (res.ok) {
            const data = await res.json();
            setTranscripts(data.transcripts);
        }
    };

    useEffect(() => {
        if (session) {
            fetchTranscripts();
        }
    }, [session]);

    const handleLogout = async () => {
        await authClient.signOut();
        router.push("/");
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setError("");

        const formData = new FormData();
        formData.append("audio", file);

        try {
            const res = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                setFile(null);
                e.target.reset();
                fetchTranscripts();
            } else {
                setError(data.error || "Upload failed");
            }
        } catch (err) {
            setError("An error occurred during transcription");
        } finally {
            setUploading(false);
        }
    };

    if (isPending || !session) return <p style={{ padding: "20px" }}>Loading...</p>;

    return (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} style={{ padding: "8px 16px", cursor: "pointer" }}>Logout</button>
            </div>

            <div style={{ marginBottom: "40px", padding: "20px", border: "1px solid #ddd" }}>
                <h3>Upload Audio (&lt; 1 min)</h3>
                {error && <p style={{ color: "red" }}>{error}</p>}
                <form onSubmit={handleUpload} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                    />
                    <button type="submit" disabled={uploading || !file} style={{ padding: "8px 16px", cursor: "pointer" }}>
                        {uploading ? "Transcribing..." : "Transcribe"}
                    </button>
                </form>
            </div>

            <div>
                <h3>Your Transcripts</h3>
                {transcripts.length === 0 ? (
                    <p>No transcripts found.</p>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f4f4f4", textAlign: "left" }}>
                                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Date</th>
                                <th style={{ padding: "12px", border: "1px solid #ddd" }}>Transcript Text</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transcripts.map((t) => (
                                <tr key={t.id}>
                                    <td style={{ padding: "12px", border: "1px solid #ddd", width: "150px" }}>
                                        {new Date(t.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                                        {t.text}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
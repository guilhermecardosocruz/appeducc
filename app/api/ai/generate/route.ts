import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { content, action } = body;

    if (!content || !action) {
      return NextResponse.json(
        { error: "Conteúdo e ação são obrigatórios." },
        { status: 400 }
      );
    }

    const prompt = `
Você é um professor experiente.

Baseado no conteúdo abaixo:
"${content}"

Execute a seguinte ação:
"${action}"

Responda de forma clara, organizada e prática para uso em sala de aula.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um assistente educacional.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao gerar resposta da IA." },
      { status: 500 }
    );
  }
}

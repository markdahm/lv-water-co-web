import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'data.json');

// GitHub API configuration (for production)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'jakecdahm/lv-water-co-web';
const GITHUB_FILE_PATH = 'data/data.json';

async function readFromGitHub() {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error('Failed to read from GitHub');
  }

  const { content, sha } = await res.json();
  const data = JSON.parse(Buffer.from(content, 'base64').toString('utf-8'));
  return { data, sha };
}

async function writeToGitHub(data: object, sha: string) {
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update data via web app',
        content,
        sha,
      }),
    }
  );

  if (!res.ok) {
    throw new Error('Failed to write to GitHub');
  }
}

// GET: Read data
export async function GET() {
  try {
    // Use GitHub API in production, local file in development
    if (GITHUB_TOKEN && process.env.NODE_ENV === 'production') {
      const { data } = await readFromGitHub();
      return NextResponse.json(data);
    }

    // Local file for development
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return NextResponse.json(
      { error: 'Failed to read data' },
      { status: 500 }
    );
  }
}

// POST: Write data
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Use GitHub API in production
    if (GITHUB_TOKEN && process.env.NODE_ENV === 'production') {
      const { sha } = await readFromGitHub();
      await writeToGitHub(data, sha);
      return NextResponse.json({ success: true });
    }

    // Local file for development
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing data:', error);
    return NextResponse.json(
      { error: 'Failed to write data' },
      { status: 500 }
    );
  }
}

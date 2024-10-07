import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const response = await fetch('https://api.github.com/repos/zenz-vipul/Automation_CI-CD/actions', {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 
      },
    });

    const data = await response.json();

    res.status(200).json(data);
}

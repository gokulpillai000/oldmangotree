import React from 'react';
import { notFound } from 'next/navigation';
import { getIssueById, getAllIssues, getAllArticles } from '@/lib/content';
import { MagazinePacketClient } from '@/components/MagazinePacketClient';

interface IssuePageProps {
  params: {
    packet: string;
  };
}

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const issues = await getAllIssues();
  if (issues.length === 0) return [{ packet: '_empty' }];
  return issues.map((i) => ({
    packet: i.id,
  }));
}

export default async function IssuePacketPage({ params }: IssuePageProps) {
  const { packet } = params;
  const issue = await getIssueById(packet);

  if (!issue) {
    notFound();
  }

  const allArticles = await getAllArticles();
  const issueArticles = allArticles.filter((a) =>
    issue.articleSlugs.includes(a.slug)
  );

  return (
    <MagazinePacketClient
      initialIssue={issue}
      initialArticles={issueArticles}
    />
  );
}

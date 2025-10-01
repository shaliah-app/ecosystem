'use client'

import { AuthWrapper } from "@/components/AuthWrapper";

interface HomeContentProps {
  title: string;
  welcome: string;
}

export function HomeContent({ title, welcome }: HomeContentProps) {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <h1 className="text-4xl font-bold">{title}</h1>
        <p className="text-lg text-center max-w-md">
          {welcome}
        </p>

        <div className="w-full max-w-md">
          <AuthWrapper />
        </div>
      </main>
    </div>
  );
}
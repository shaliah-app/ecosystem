import { getTranslations } from 'next-intl/server';
import { HomeContent } from "@/components/HomeContent";

export default async function Home() {
  const t = await getTranslations('HomePage');

  return (
    <HomeContent
      title={t('title')}
      welcome={t('welcome')}
    />
  );
}

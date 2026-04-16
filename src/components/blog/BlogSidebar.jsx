import RecentPostsWidget from './RecentPostsWidget';
import PromoWidget from './PromoWidget';
import pulsemindImg from '../../assets/pulsemind01.jpeg';
import pulsemindVideo from '../../assets/pulsemind-promo.mp4';

export default function BlogSidebar({ excludePostId }) {
  return (
    <aside>
      <RecentPostsWidget excludePostId={excludePostId} />

      <PromoWidget
        variant="image"
        image={pulsemindImg}
        title="Pulsemind"
        description="IA generativa para empresas e equipes de marketing"
        cta="Conhecer"
        href="https://pulsemind.com.br"
      />

      <PromoWidget
        variant="video"
        video={pulsemindVideo}
        title="Pulsemind em ação"
        cta="Conhecer"
        href="https://pulsemind.com.br"
      />

      <PromoWidget
        variant="text"
        badge="A partir de R$ 497/mês"
        title="Mentoria Zero-to-Hero IA"
        description="2 encontros por semana. Pare de estudar como espectador."
        cta="Ver planos"
        href="/#planos"
      />
    </aside>
  );
}

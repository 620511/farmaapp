import { useState } from 'react';
import DeliveryIllustration from './DeliveryIllustration.jsx';

export default function HeroPhoto() {
  const [photoFailed, setPhotoFailed] = useState(false);

  if (photoFailed) return <DeliveryIllustration />;

  return (
    <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-xl">
      <img
        src="/images/delivery-hero.jpg"
        alt="Entregador Farma.APP"
        onError={() => setPhotoFailed(true)}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/40 via-transparent to-transparent" />
    </div>
  );
}

import {
  HeroBanner,
  CategoryGrid,
  FeaturedProducts,
  PromotionCarousel,
  WhyChooseUs,
  ReviewSlider,
  ProductRecommendations,
} from "@/components/customer";

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryGrid />
      <FeaturedProducts />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
        <ProductRecommendations variant="bestsellers" limit={32} />
        <ProductRecommendations variant="personalized" limit={32} />
        <ProductRecommendations variant="recent" limit={4} />
      </div>
      <PromotionCarousel />
      <WhyChooseUs />
      <ReviewSlider />
    </>
  );
}

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ProductRecommendations variant="personalized" />
      </div>
      <PromotionCarousel />
      <WhyChooseUs />
      <ReviewSlider />
    </>
  );
}

"use client";

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import ProductCard from "../reusables/ProductCard"; 

const CarouselField = ({ products = [] }) => {
  const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 4,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 4,
    },
    tablet1: {
      breakpoint: { max: 1024, min: 900 },
      items: 2.7,
    },
    tablet: {
      breakpoint: { max: 900, min: 700 },
      items: 2.3,
    },
    semiTablet2: {
      breakpoint: { max: 700, min: 590 },
      items: 2.1,
    },
     semiTablet1: {
      breakpoint: { max: 590, min: 558 },
      items: 1.8,
    },
     semiTablet: {
      breakpoint: { max: 558, min: 464 },
      items: 1.6,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1.2,
    },
  };

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="  lg:hidden pl-6 md:pl-9 pt-8">
      <Carousel
        responsive={responsive}
        className="pb-[60px] w-full  "
        arrows={false}
        showDots={true}
        swipeable={true}
        draggable={true}
        partialVisible={true} // ✅ Correct spelling
        partialVisibilityGutter={70}
      >
        {products.map((item) => (
          <ProductCard key={item.productId || item.id} product={item} utilityClassName="!w-[260px] md:!w-[295px] !h-auto" />
        ))}
      </Carousel>
    </div>
  );
};

export default CarouselField;

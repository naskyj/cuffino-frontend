"use client";
import Image from "next/image";
import Link from "next/link";

const ProductCard = ({ product, utilityClassName }) => {
  const { productId, id, name, price, images = [], imageUrl } = product || {};

  const imageUrlLink = images[0]?.imageUrl || imageUrl || "/placeholder.png";
  const prdId = productId || id;

  return (
    <div className={`group `} key={prdId}>
      <Link href={`/products/${prdId}`} className="block">
        <div className="relative overflow-hidden duration-500">
          <Image
            height={400}
            width={324}
            src={`${imageUrlLink}`}
            className={`${utilityClassName || ""} w-full h-auto object-cover duration-500 group-hover:rounded-lg`}
            alt={name || "Product image"}
          />
        </div>
        <div className="flex flex-col pt-3">
          <p className="text-lg font-semibold hover:text-primary transition-colors">
            {name}
          </p>
          <p className="text-sm font-medium hover:text-primary transition-colors">
            ${price}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;

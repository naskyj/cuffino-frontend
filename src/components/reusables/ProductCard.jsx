"use client";
import Image from "next/image";
import Link from "next/link";
import useCart from "@/core/zustand/cart.store";
import { toast } from "sonner";

const ProductCard = ({ product, utilityClassName }) => {
  const { productId, id, name, price, images = [], imageUrl } = product || {};

  const imageUrlLink = images[0]?.imageUrl || imageUrl || "/placeholder.png";
  const prdId = productId || id;

  console.log("image is", imageUrlLink);

  return (
    <div className={`group `} key={prdId}>
      <Link href={`/products/${prdId}`} className="block">
        <div className="relative overflow-hidden duration-500">
          <Image
            height={0}
            width={0}
            src={`${imageUrlLink}`}
            className={`${utilityClassName} w-full h-full duration-500 group-hover:rounded-lg`}
            alt=""
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

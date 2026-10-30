"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export const FABRIC_PLACEHOLDER = "/assets/images/fabric-placeholder.svg";

const ProductCard = ({ product, utilityClassName }) => {
  const { productId, id, name, price, images = [], imageUrl } = product || {};
  const [failed, setFailed] = useState(false);

  const imageUrlLink =
    (!failed && (images?.[0]?.imageUrl || imageUrl)) || FABRIC_PLACEHOLDER;
  const prdId = productId || id;

  return (
    <div className={`group `} key={prdId}>
      <Link href={`/products/${prdId}`} className="block">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F3E3D3] duration-500 group-hover:rounded-lg">
          <Image
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
            src={`${imageUrlLink}`}
            onError={() => setFailed(true)}
            className={`${utilityClassName || ""} object-cover object-top duration-500`}
            alt={name || "Product image"}
          />
        </div>
        <div className="flex flex-col pt-3">
          <p className="text-lg font-semibold hover:text-primary transition-colors">
            {name}
          </p>
          <p className="text-sm font-medium hover:text-primary transition-colors">
            From ${String(price ?? "").replace("$", "")}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;

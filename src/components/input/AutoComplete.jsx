import { useState, useRef } from "react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

const AddressAutocomplete = ({ form, name = "streetAddress", fieldNames = {} }) => {
  const { city = "city", state = "state", postalCode = "postalCode" } = fieldNames;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
    libraries,
  });

  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(form.values[name] || "");

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();

    if (!place || !place.address_components) return;

    const address = place.formatted_address || "";
    const cityValue =
      place.address_components.find((component) =>
        component.types.includes("locality")
      )?.long_name || "";
    const stateValue =
      place.address_components.find((component) =>
        component.types.includes("administrative_area_level_1")
      )?.long_name || "";
    const postalCodeValue =
      place.address_components.find((component) =>
        component.types.includes("postal_code")
      )?.long_name || "";

    setInputValue(address);
    form.setFieldValue(name, address);
    form.setFieldValue(city, cityValue);
    form.setFieldValue(state, stateValue);
    form.setFieldValue(postalCode, postalCodeValue.replace(" ", ""));
  };

  if (!isLoaded) return <p>Loading...</p>;

  return (
    <Autocomplete
      onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
      onPlaceChanged={handlePlaceSelect}
      options={{
        types: ["address"],
        componentRestrictions: { country: ["us"] },
      }}
    >
      <input
        type="text"
        placeholder="Enter your Home address"
        className="mt-3 p-2 border rounded w-full"
        value={inputValue}
        onChange={(e) => {
          form.setFieldValue(name, e.target.value);
          setInputValue(e.target.value);
        }}
      />
    </Autocomplete>
  );
};

export default AddressAutocomplete;

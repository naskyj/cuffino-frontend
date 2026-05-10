import React from 'react';
import { useField, useFormikContext } from 'formik';
import { useState } from 'react';

const FileInput = ({ label, imageSrc, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const { setFieldValue } = useFormikContext();
  const [fileName, setFileName] = useState('');

  const handleChange = (event) => {
    const file = event.currentTarget.files[0];
    setFieldValue(field.name, file);
    setFileName(file ? file.name : '');
  };

  return (
    <div className="">
      <label htmlFor={props.id || props.name} className="text-black text-[14px] font-[600] px-1 pb-1">
        {label}
      </label>
      <div className="border border-[#DEDEDE] rounded-[4px] sharp-sans">
      <input
        id={props.id || props.name}
        name={field.name}
        type="file"
        onChange={handleChange}
        className="hidden" // Hide the default file input
      />
      {/* using an image to open the file section instead of the default "choose file" button */}
      <div className="py-4 px-4" onClick={() => document.getElementById(props.id || props.name).click()}>
        <div className="border-dashed rounded-[4px] border-1 border-[#DEDEDE] flex flex-col items-center p-3">
            <img src={require(`../../Images/${imageSrc}`)} alt="Upload" className="cursor-pointer" />
            <p className='text-base urbanist-font'>Click here to upload</p>
            {fileName && (
        <div className="text-[10px] mt-1 text-center">{fileName}</div>
      )}
        </div>
       
       
      </div>
      {meta.touched && meta.error ? (
        <div className="text-red-500 text-xs mt-1">{meta.error}</div>
      ) : null}
      </div>
    </div>

  );
};

export default FileInput;
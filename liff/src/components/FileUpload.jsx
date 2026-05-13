export default function FileUpload({ label, name, onChange, required = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#B7E4C7]">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type="file"
          name={name}
          accept="image/*,.pdf"
          onChange={onChange}
          className="block w-full text-sm text-white
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-[#52B788] file:text-white
            hover:file:bg-[#40a070]
            file:cursor-pointer
            cursor-pointer"
        />
      </div>
      <p className="text-xs text-[#B7E4C7] opacity-70">
        Accepted: images (JPG, PNG, WebP) or PDF. Max 5MB.
      </p>
    </div>
  );
}

// Reusable location input with datalist dropdown from existing trip locations
export default function LocationInput({ value, onChange, placeholder, locations, id }) {
  const listId = id || 'locations-list';
  return (
    <>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Type or select location'}
        list={listId}
        autoComplete="off"
        required
      />
      <datalist id={listId}>
        {locations.map((loc, i) => (
          <option key={i} value={loc} />
        ))}
      </datalist>
    </>
  );
}

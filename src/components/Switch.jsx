export default function Switch({ on, onChange }) {
  return (
    <button role="switch" aria-checked={on} className={`switch ${on ? 'on' : ''}`} onClick={onChange}>
      <i />
    </button>
  );
}
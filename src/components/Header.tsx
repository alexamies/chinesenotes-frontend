import HamburgerMenu from "./HamburgerMenu";

export default function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="bg-primary text-white px-4 py-4 flex items-center gap-4">
      <HamburgerMenu />
      <h1 className="text-2xl font-semibold tracking-wide">
        <a href="/" className="hover:underline">
          {title}
        </a>
        {subtitle && (
          <span className="text-sm font-normal opacity-80 ml-2">{subtitle}</span>
        )}
      </h1>
    </header>
  );
}

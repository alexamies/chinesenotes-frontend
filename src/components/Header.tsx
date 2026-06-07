import HamburgerMenu from "./HamburgerMenu";

export default function Header({ title }: { title: string }) {
  return (
    <header className="bg-primary text-white px-4 py-4 flex items-center gap-4">
      <HamburgerMenu />
      <h1 className="text-2xl font-semibold tracking-wide">{title}</h1>
    </header>
  );
}

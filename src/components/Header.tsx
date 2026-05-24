import HamburgerMenu from "./HamburgerMenu";

export default function Header() {
  return (
    <header className="bg-primary text-white px-4 py-4 flex items-center gap-4">
      <HamburgerMenu />
      <h1 className="text-2xl font-semibold tracking-wide">Chinese Notes 中文笔记</h1>
    </header>
  );
}

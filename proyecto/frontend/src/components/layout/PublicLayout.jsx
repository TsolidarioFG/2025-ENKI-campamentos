import Navbar from "./Navbar";

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="page">
        {children}
      </main>
    </>
  );
}
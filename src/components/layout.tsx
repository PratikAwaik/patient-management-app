interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({children}: LayoutProps) {
  return (
    <div className="w-full h-full p-4 flex items-center justify-center max-w-4xl mx-auto">
      {children}
    </div>
  );
}

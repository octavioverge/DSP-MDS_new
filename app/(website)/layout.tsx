import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ScrollAnimations from "@/app/components/ScrollAnimations";

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ScrollAnimations />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}

import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-brand-nav text-white border-t border-brand-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/assets/brand/ffl-icon.svg"
                alt="Fantasy Football Ladder"
                width={32}
                height={32}
              />
              <h3 className="text-lg font-display font-semibold">
                Fantasy Football Ladder
              </h3>
            </div>
            <p className="text-sm font-sans text-brand-navy-200">
              A promotion & relegation-first fantasy football experience with
              multi-tier competition, premium visuals, and zero ads.
            </p>
            <p className="text-xs font-sans text-brand-navy-300">
              Early access · Work in progress
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-sm font-display font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-sm font-display font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 className="text-sm font-display font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm font-sans text-brand-navy-200 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-brand-navy-800">
          <p className="text-center text-xs font-sans text-brand-navy-300">
            © {new Date().getFullYear()} Fantasy Football Ladder. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

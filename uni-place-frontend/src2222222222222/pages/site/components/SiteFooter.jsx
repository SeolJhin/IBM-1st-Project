import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const DropLink = ({ to, children }) => (
    <Link
      to={to}
      className="relative inline-block group cursor-pointer z-[1000]"
    >
      {/* 위에서 아래로 떨어지는 원 */}
      <span
        className="absolute left-1/2 bottom-5 -translate-x-1/2 -translate-y-[250%]
                   w-2 h-2 bg-white rounded-full opacity-0
                   transition-all duration-700
                   ease-[cubic-bezier(0.34,1.56,0.64,1)]
                   group-hover:-translate-y-1/2 group-hover:opacity-100
                   pointer-events-none z-[9998]"
      />

      {/* 텍스트 */}
      <span
        className="relative z-[1000] text-[#8f949b] text-sm
                   transition-colors duration-300
                   group-hover:text-white whitespace-nowrap px-1"
      >
        {children}
      </span>
    </Link>
  );

  return (
    <footer className="bg-black w-full relative z-[1000] isolate pointer-events-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="flex justify-between items-end mb-20">
          <div className="text-left">
            <div className="text-white text-xs mb-3 opacity-60">
              이벤트도 본사 (창업문의)
            </div>

            <div className="text-white text-[35px] font-bold leading-tight mb-6 tracking-tight">
              1588-5942
            </div>

            <div className="text-white text-sm space-y-1 opacity-60 mb-8">
              <div>평일 09:00-17:00</div>
              <div>점심시간 12:00-13:00</div>
              <div>주말, 공휴일 휴무</div>
            </div>

            <div className="text-white text-xs opacity-50 space-y-1">
              <div>
                (주)푸푸컴퍼니 경기도 성남시 수정구 창업로42, 경기기업성장센터
                819호
              </div>
              <div>사업자등록번호 456-87-00752 대표이사 : 홍길동</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-[#1a1a1a] pt-8">
          <div className="flex items-center gap-1">
            <DropLink to="/policy/privacypolicy">개인정보처리방침</DropLink>
            <span className="text-[#333333] text-sm mx-1">|</span>
            <DropLink to="/policy/eftterms">전자금융거래 기본약관</DropLink>
            <span className="text-[#333333] text-sm mx-1">|</span>
            <DropLink to="/policy/termsofservice">이용약관</DropLink>
            <span className="text-[#333333] text-sm mx-1">|</span>
            <DropLink to="/policy/serviceguide">이용안내</DropLink>
            <span className="text-[#333333] text-sm mx-1">|</span>
            <DropLink to="/policy/aboutus">회사소개</DropLink>
            <span className="text-[#333333] text-sm mx-1">|</span>
            <a
              href="/admin/intro"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-block group cursor-pointer px-1"
            >
              {/* 점 애니메이션 */}
              <span
                className="absolute left-1/2 bottom-5 -translate-x-1/2 -translate-y-[250%]
               w-2 h-2 bg-[#006BF0] rounded-full opacity-0
               transition-all duration-700
               ease-[cubic-bezier(0.34,1.56,0.64,1)]
               group-hover:-translate-y-1/2 group-hover:opacity-100
               pointer-events-none"
              />

              {/* 텍스트 */}
              {/* <span
                className="text-[#8f949b] text-sm
               transition-colors duration-300
               group-hover:text-[#006BF0]
               whitespace-nowrap"
              >
                관리자센터
              </span> */}
            </a>
          </div>

          <div>
            <span className="text-white text-xs opacity-80">
              © {new Date().getFullYear()} pupoo. All rights reserved.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

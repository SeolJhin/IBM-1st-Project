import { Routes, Route } from "react-router-dom";
import SiteLayout from "./layouts/SiteLayout";
import ScrollToTop from "./ScrollToTop";

/* admin */
import Intro from "./pages/admin/intro";
import AdminDashboard from "./pages/admin/dashboard";

/* Home */
import Home from "./pages/site/home/Home";

/* Auth */
import Login from "./pages/site/auth/Login";
import Mypage from "./pages/site/auth/mypage";
import JoinSelect from "./pages/site/auth/join/JoinSelect";
import JoinNormal from "./pages/site/auth/join/JoinNormal";
import JoinSocial from "./pages/site/auth/join/JoinSocial";

/* Event */
import Current from "./pages/site/event/Current";
import Upcoming from "./pages/site/event/Upcoming";
import Closed from "./pages/site/event/Closed";
import PreRegister from "./pages/site/event/PreRegister";
import EventSchedule from "./pages/site/event/EventSchedule";

/* Program */
import Experience from "./pages/site/program/Experience";
import Session from "./pages/site/program/Session";
import Booth from "./pages/site/program/Booth";
import Contest from "./pages/site/program/Contest";
import Schedule from "./pages/site/program/Schedule";
import VoteResult from "./pages/site/program/VoteResult";

/* Registration */
import Apply from "./pages/site/registration/Apply";
import ApplyHistory from "./pages/site/registration/ApplyHistory";
import PaymentHistory from "./pages/site/registration/PaymentHistory";
import QRCheckin from "./pages/site/registration/QRCheckin";

/* Realtime */
import WaitingStatus from "./pages/site/realtime/WaitingStatus";
import VoteStatus from "./pages/site/realtime/VoteStatus";
import RealtimeDashboard from "./pages/site/realtime/Dashboard";

/* Community */
import FreeBoard from "./pages/site/community/FreeBoard";
import Review from "./pages/site/community/Review";
import Gallery from "./pages/site/community/Gallery";
import QnA from "./pages/site/community/QnA";
import Notice from "./pages/site/community/Notice";

/* Info */
import PlatformIntro from "./pages/site/info/PlatformIntro";

import FAQ from "./pages/site/info/FAQ";
import Inquiry from "./pages/site/info/Inquiry";
import Location from "./pages/site/info/Location";

/* Policy (※ 파일명 대소문자 맞춤) */
import AboutUs from "./pages/site/policy/aboutus";
import PrivacyPolicy from "./pages/site/policy/privacypolicy";
import ServiceGuide from "./pages/site/policy/serviceguide";
import TermsOfService from "./pages/site/policy/termsofservice";
import EFTTerms from "./pages/site/policy/EFTTerms";

/* gallery */
import EventGallery from "./pages/site/gallery/eventgallery";
import EventSketch from "./pages/site/gallery/eventsketch";

/* guide */
import Operation from "./pages/site/guide/Operation";
import LocationPage from "./pages/site/guide/location";
import Timetable from "./pages/site/guide/Timetable";
import CheckinStatus from "./pages/site/realtime/CheckinStatus";

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ---------------- 관리자 전용 ---------------- */}
        <Route path="/admin/intro" element={<Intro />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* ---------------- 일반 사이트 ---------------- */}
        <Route element={<SiteLayout />}>
          {/* Home */}
          <Route path="/" element={<Home />} />
          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/mypage" element={<Mypage />} />
          <Route path="/mypage" element={<Mypage />} /> {/* 추가 */}
          <Route path="/auth/join/joinselect" element={<JoinSelect />} />
          <Route path="/auth/join/joinnormal" element={<JoinNormal />} />
          <Route path="/auth/join/joinsocial" element={<JoinSocial />} />
          {/* Event */}
          <Route path="/event/current" element={<Current />} />
          <Route path="/event/upcoming" element={<Upcoming />} />
          <Route path="/event/closed" element={<Closed />} />
          <Route path="/event/preregister" element={<PreRegister />} />
          <Route path="/event/eventschedule" element={<EventSchedule />} />
          {/* Program */}
          {/* 중요 (뒤에 /:eventId? 만 추가 */}
          <Route
            path="/program/experience/:eventId?"
            element={<Experience />}
          />
          <Route path="/program/session/:eventId?" element={<Session />} />
          <Route path="/program/schedule/:eventId?" element={<Schedule />} />
          <Route path="/program/contest/:eventId?" element={<Contest />} />
          <Route path="/program/booth/:eventId?" element={<Booth />} />
          {/* Registration */}
          <Route path="/registration/apply" element={<Apply />} />
          <Route path="/registration/applyhistory" element={<ApplyHistory />} />
          <Route
            path="/registration/paymenthistory"
            element={<PaymentHistory />}
          />
          <Route path="/registration/qrcheckin" element={<QRCheckin />} />
          {/* Realtime */}
          <Route
            path="/realtime/dashboard/:eventId?"
            element={<RealtimeDashboard />}
          />
          <Route
            path="/realtime/checkinstatus/:eventId?"
            element={<CheckinStatus />}
          />
          <Route
            path="/realtime/votestatus/:eventId?"
            element={<VoteStatus />}
          />
          <Route
            path="/realtime/waitingstatus/:eventId?"
            element={<WaitingStatus />}
          />
          {/* Community */}
          <Route path="/community/freeboard" element={<FreeBoard />} />
          <Route path="/community/review" element={<Review />} />
          <Route path="/community/gallery" element={<Gallery />} />
          <Route path="/community/qna" element={<QnA />} />
          <Route path="/community/notice" element={<Notice />} />
          {/* Info */}
          <Route path="/info/intro" element={<PlatformIntro />} />
          <Route path="/info/faq" element={<FAQ />} />
          <Route path="/info/inquiry" element={<Inquiry />} />
          <Route path="/info/location" element={<Location />} />
          {/* Policy */}
          <Route path="/policy/aboutus" element={<AboutUs />} />
          <Route path="/policy/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/policy/serviceguide" element={<ServiceGuide />} />
          <Route path="/policy/termsofservice" element={<TermsOfService />} />
          <Route path="/policy/eftterms" element={<EFTTerms />} />
          {/*gallery*/}
          <Route path="/gallery/eventgallery" element={<EventGallery />} />
          <Route path="/gallery/eventsketch" element={<EventSketch />} />
          {/* guide */}
          <Route path="/guide/location" element={<LocationPage />} />
          <Route path="/guide/operation" element={<Operation />} />
          <Route path="/guide/timetable" element={<Timetable />} />
        </Route>
      </Routes>
    </>
  );
}

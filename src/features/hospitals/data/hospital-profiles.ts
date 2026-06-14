import {
  AB_HOSPITAL_ID,
  BANOBAGI_HOSPITAL_ID,
  BROWN_HOSPITAL_ID,
  DA_HOSPITAL_ID,
  ID_HOSPITAL_ID,
  LIFTING_HOSPITAL_ID,
  MC365_HOSPITAL_ID,
  MD_HOSPITAL_ID,
  RYAN_HOSPITAL_ID,
  TS_HOSPITAL_ID,
  WITH_HOSPITAL_ID,
  WONJIN_HOSPITAL_ID,
} from "@/features/hospitals/constants/hospitals";
import type { HospitalProfile } from "@/features/hospitals/types/hospital-profile.types";

const DOC = {
  a: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=240&h=240&fit=crop",
  b: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=240&h=240&fit=crop",
  c: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=240&h=240&fit=crop",
  d: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=240&h=240&fit=crop",
  e: "https://images.unsplash.com/photo-1537368910025-700350b59a0e?w=240&h=240&fit=crop",
  f: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=240&h=240&fit=crop",
} as const;

/** PreFit 제휴 병원 소개 · 원장 프로필 (데모 콘텐츠) */
export const HOSPITAL_PROFILES: Record<string, HospitalProfile> = {
  with: {
    hospitalId: WITH_HOSPITAL_ID,
    slug: "with",
    tagline: "자연스러운 아름다움, 데이터로 증명하는 상담",
    introShort:
      "강남 위드성형외과는 눈·코·가슴·리프팅 전문 클리닉으로, 유튜브 Q&A를 통해 수술 전후·회복·비용까지 투명하게 안내합니다.",
    introFull:
      "위드성형외과는 환자 맞춤 디자인과 과하지 않은 자연스러운 결과를 지향합니다. AI 상담에 연동된 유튜브 대본에는 쌍꺼풀 부종 경과, 모티바 보형물 비용 구성, 시대별 눈 트렌드 등 실제 원장님 설명이 담겨 있습니다.\n\nPreFit에서는 위드 채널 영상 구간을 질문과 매칭해, 원장님이 직접 말한 구간을 바로 재생할 수 있습니다.",
    address: "서울특별시 강남구 테헤란로 123",
    addressDetail: "위드타워 5–8층",
    mapUrl: "https://map.naver.com/v5/search/위드성형외과",
    phone: "02-1234-5678",
    website: "https://www.withps.co.kr",
    hours: "평일 10:00–19:00 · 토 10:00–16:00",
    highlights: ["눈·코·가슴 통합 상담", "유튜브 Q&A 답변 제공", "회복·비용 투명 안내"],
    doctors: [
      {
        id: "with-1",
        name: "김○○",
        title: "대표원장 · 성형외과 전문의",
        specialties: ["눈성형", "코성형", "리비전"],
        photoUrl: DOC.a,
        bio: "자연스러운 눈매·코 라인 디자인과 재수술 케이스 풍부.",
        career: ["대한성형외과학회 정회원", "前 강남 대형병원 성형외과 과장"],
      },
      {
        id: "with-2",
        name: "이○○",
        title: "원장 · 성형외과 전문의",
        specialties: ["가슴성형", "보형물", "모티바"],
        photoUrl: DOC.b,
        bio: "보형물 선택·마취·부가비용까지 상담 영상으로 상세 설명.",
        career: ["가슴성형 연구회 활동", "모티바·멘토 인증"],
      },
    ],
  },
  "id-hospital": {
    hospitalId: ID_HOSPITAL_ID,
    slug: "id-hospital",
    tagline: "아시아 No.1 규모 · 눈·코·윤곽·가슴 토탈 케어",
    introShort:
      "아이디병원은 압구정 일대 대형 성형·피부·치과 통합 병원으로, 다국어 상담과 부위별 전문 센터를 운영합니다.",
    introFull:
      "아이디병원은 눈·코·가슴·양악·윤곽·리프팅·피부·치과까지 원스톱 상담이 가능한 메가 병원입니다. @IDhospital 채널에는 수술 리뷰, MZ 트렌드, 해외 환자 Q&A 등 다양한 포맷의 영상이 축적되어 있습니다.",
    address: "서울특별시 강남구 압구정로 517",
    addressDetail: "아이디병원 빌딩",
    mapUrl: "https://map.naver.com/v5/search/아이디병원",
    phone: "02-3497-0000",
    website: "https://www.idhospital.com",
    hours: "연중무휴 10:00–19:00 (부서별 상이)",
    highlights: ["눈·코·윤곽·가슴 원스톱", "다국어 상담", "풍부한 유튜브 답변"],
    doctors: [
      {
        id: "id-1",
        name: "박○○",
        title: "눈성형센터 대표",
        specialties: ["눈성형", "트임", "안검하수"],
        photoUrl: DOC.c,
        bio: "쌍꺼풀·트임·눈매교정 케이스 다수, 해외 환자 상담 경험 풍부.",
        career: ["대한성형외과학회", "아이디 눈성형센터 15년+"],
      },
      {
        id: "id-2",
        name: "정○○",
        title: "윤곽·양악센터 원장",
        specialties: ["양악", "윤곽", "사각턱"],
        photoUrl: DOC.d,
        bio: "3D CT 기반 윤곽 설계 및 안전 수술 프로토콜 운영.",
        career: ["구강악안면외과 전문의", "양악수술 3,000건+"],
      },
    ],
  },
  "da-plastic": {
    hospitalId: DA_HOSPITAL_ID,
    slug: "da-plastic",
    tagline: "DA만의 감각 · 쇼츠·브이로그로 보는 리얼 상담",
    introShort:
      "디에이성형외과는 강남 기반 눈·코·가슴·리프팅·윤곽 클리닉으로, @DAPRS 채널의 쇼츠·브이로그형 콘텐츠가 풍부합니다.",
    introFull:
      "디에이성형외과는 젊은 층 트렌드에 맞춘 디자인과 친근한 영상 콘텐츠로 상담 진입 장벽을 낮춥니다. 피부 부스터·선크림·렌즈 왜곡 등 일상 밀착 주제도 다룹니다.",
    address: "서울특별시 강남구 논현로 858",
    addressDetail: "DA빌딩",
    mapUrl: "https://map.naver.com/v5/search/디에이성형외과",
    phone: "02-515-0000",
    website: "https://www.daprs.com",
    hours: "평일 10:00–19:00 · 토 10:00–15:00",
    highlights: ["쇼츠·브이로그 답변", "눈·코·가슴", "MZ 트렌드 디자인"],
    doctors: [
      {
        id: "da-1",
        name: "강○○",
        title: "대표원장",
        specialties: ["눈성형", "눈매교정", "트임"],
        photoUrl: DOC.a,
        bio: "남성·여성 눈매교정 Q&A, 쌍꺼풀 라인 트렌드 설명.",
        career: ["대한성형외과학회", "DA 눈성형 10년+"],
      },
      {
        id: "da-2",
        name: "윤○○",
        title: "코성형 원장",
        specialties: ["코성형", "코재수술", "콧볼"],
        photoUrl: DOC.f,
        bio: "자연스러운 코 라인·기능(호흡) 동시 고려 상담.",
        career: ["비염·코성형 통합 상담", "코재수술 전문"],
      },
    ],
  },
  banobagi: {
    hospitalId: BANOBAGI_HOSPITAL_ID,
    slug: "banobagi",
    tagline: "렛미인의 전통 · 메이크오버 전문",
    introShort:
      "바노바기성형외과는 메이크오버·딥다이브 의학 영상과 눈·코·가슴·안티에이징 전문성으로 유명합니다.",
    introFull:
      "바노바기는 TV 프로그램을 통해 대중에게 익숙한 브랜드로, 전후 비교·중년 안티에이징·눈밑 지방 재배치 등 다양한 케이스 영상이 있습니다.",
    address: "서울특별시 서초구 강남대로 415",
    addressDetail: "바노바기빌딩",
    mapUrl: "https://map.naver.com/v5/search/바노바기성형외과",
    phone: "02-522-0000",
    website: "https://www.banobagi.com",
    hours: "평일 10:00–19:00",
    highlights: ["메이크오버·전후 케이스", "안티에이징", "눈·코·가슴"],
    doctors: [
      {
        id: "bano-1",
        name: "송○○",
        title: "대표원장",
        specialties: ["눈성형", "안검하수", "중년 눈"],
        photoUrl: DOC.b,
        bio: "눈밑·중안면·하안검 케이스 리뷰 영상 다수.",
        career: ["대한성형외과학회", "안티에이징 연구"],
      },
    ],
  },
  wonjin: {
    hospitalId: WONJIN_HOSPITAL_ID,
    slug: "wonjin",
    tagline: "글로벌 No.1을 향해 · 다국어 원스톱",
    introShort:
      "원진성형외과는 강남 대표 성형외과로, 다국어 상담과 눈·코·가슴·윤곽 통합 케어를 제공합니다.",
    introFull:
      "원진은 해외 환자 비율이 높은 병원으로, 영·중·일 등 다국어 상담 인프라가 갖춰져 있습니다.",
    address: "서울특별시 서초구 강남대로 419",
    mapUrl: "https://map.naver.com/v5/search/원진성형외과",
    phone: "02-510-0000",
    website: "https://www.wonjin.co.kr",
    hours: "평일 10:00–19:00",
    highlights: ["다국어 상담", "눈·코·윤곽", "글로벌 환자 케어"],
    doctors: [
      {
        id: "won-1",
        name: "오○○",
        title: "대표원장",
        specialties: ["눈", "코", "윤곽"],
        photoUrl: DOC.d,
        bio: "아시아·서구 환자 맞춤 라인 디자인.",
        career: ["대한성형외과학회", "국제 학회 다수"],
      },
    ],
  },
  "365mc": {
    hospitalId: MC365_HOSPITAL_ID,
    slug: "365mc",
    tagline: "지방이 IP · 지방흡입 특화",
    introShort:
      "365mc는 지방흡입·다이어트·체형 교정 전문 병원으로, ‘지방이’ 캐릭터와 교육형 영상을 제공합니다.",
    introFull:
      "365mc는 부위별·양별 지방흡입, 365 라인, 다이어트 클리닉 등 체형 전문 병원입니다.",
    address: "서울특별시 강남구 논현로 831",
    mapUrl: "https://map.naver.com/v5/search/365mc",
    phone: "02-567-0000",
    website: "https://www.365mc.co.kr",
    hours: "평일 10:00–19:00",
    highlights: ["지방흡입 특화", "체형·다이어트", "지방이 콘텐츠"],
    doctors: [
      {
        id: "365-1",
        name: "조○○",
        title: "대표원장 · 지방흡입 전문",
        specialties: ["지방흡입", "복부", "팔·허벅지"],
        photoUrl: DOC.a,
        bio: "부위별 흡입량·피부 탄력 맞춤 설계.",
        career: ["지방흡입 20년+"],
      },
    ],
  },
  lifting: {
    hospitalId: LIFTING_HOSPITAL_ID,
    slug: "lifting",
    tagline: "리프팅만 20년 · 안면거상·중년 특화",
    introShort:
      "리팅성형외과는 안면거상·실리프팅·중년 피부 처짐 전문 클리닉입니다.",
    introFull:
      "울쎄라·써마지·실리프팅·거상술 비교 영상이 풍부합니다.",
    address: "서울특별시 강남구 선릉로 572",
    mapUrl: "https://map.naver.com/v5/search/리팅성형외과",
    phone: "02-555-0000",
    website: "https://www.lifting.co.kr",
    hours: "평일 10:00–18:30",
    highlights: ["안면거상", "울쎄라·써마지", "중년 특화"],
    doctors: [
      {
        id: "lift-1",
        name: "배○○",
        title: "대표원장 · 리프팅 전문",
        specialties: ["안면거상", "미니거상", "목거상"],
        photoUrl: DOC.b,
        bio: "나이·처짐 정도별 맞춤 리프팅 로드맵.",
        career: ["리프팅 20년+"],
      },
    ],
  },
  "md-breast": {
    hospitalId: MD_HOSPITAL_ID,
    slug: "md-breast",
    tagline: "가슴성형 25년 · 보형물·구형구축 전문",
    introShort: "엠디성형외과는 가슴성형·보형물·구형구축·재수술 specialty 병원입니다.",
    introFull: "MD는 가슴만 다루는 병원으로, 모티바·멘토·절개·회복 FAQ가 매우 상세합니다.",
    address: "서울특별시 강남구 테헤란로 822",
    mapUrl: "https://map.naver.com/v5/search/엠디성형외과",
    phone: "02-568-0000",
    website: "https://www.mdbreast.com",
    hours: "평일 10:00–19:00",
    highlights: ["가슴 전문", "구형구축", "보형물 비교"],
    doctors: [
      {
        id: "md-1",
        name: "유○○",
        title: "대표원장",
        specialties: ["가슴확대", "보형물", "구형구축"],
        photoUrl: DOC.d,
        bio: "보형물 선택·구형구축 예방·재수술 프로토콜.",
        career: ["가슴성형 25년"],
      },
    ],
  },
  ryan: {
    hospitalId: RYAN_HOSPITAL_ID,
    slug: "ryan",
    tagline: "가슴 Q&A의 명가",
    introShort: "라이안성형외과는 가슴성형·보형물 상담 Q&A 영상이 풍부합니다.",
    introFull: "회복 단계별 샤워·출근·운동, 겨드랑이 vs 밑선 절개 등 실전 FAQ를 다룹니다.",
    address: "서울특별시 강남구 강남대로 390",
    mapUrl: "https://map.naver.com/v5/search/라이안성형외과",
    phone: "02-547-0000",
    website: "https://www.ryanps.com",
    hours: "평일 10:00–19:00",
    highlights: ["가슴 Q&A", "보형물", "회복 가이드"],
    doctors: [
      {
        id: "ryan-1",
        name: "장○○",
        title: "대표원장",
        specialties: ["가슴", "보형물"],
        photoUrl: DOC.a,
        bio: "체형별 보형물·컵 선택 기준.",
        career: ["가슴성형 18년"],
      },
    ],
  },
  ab: {
    hospitalId: AB_HOSPITAL_ID,
    slug: "ab",
    tagline: "2030 트렌드 · AB만의 감각",
    introShort: "에이비성형외과는 MZ 세대를 위한 트렌디한 눈·코·윤곽 디자인 클리닉입니다.",
    introFull: "코스프레·MZ 케이스, 오해를 직접 다루는 영상 등 젊은 층 공감 콘텐츠가 많습니다.",
    address: "서울특별시 강남구 논현로 848",
    mapUrl: "https://map.naver.com/v5/search/에이비성형외과",
    phone: "02-544-0000",
    website: "https://www.abplasticsurgery.com",
    hours: "평일 10:00–19:00",
    highlights: ["MZ 트렌드", "눈·코·윤곽", "쇼츠·리얼리티"],
    doctors: [
      {
        id: "ab-1",
        name: "남○○",
        title: "대표원장",
        specialties: ["눈", "코", "윤곽"],
        photoUrl: DOC.c,
        bio: "트렌디·과하지 않은 라인.",
        career: ["대한성형외과학회"],
      },
    ],
  },
  ts: {
    hospitalId: TS_HOSPITAL_ID,
    slug: "ts",
    tagline: "티에스TV · 원장 직접 상담·라이브",
    introShort: "티에스성형외과는 원장 직접 상담·라이브 클립으로 Speech 데이터가 풍부합니다.",
    introFull: "코 5가지 변곡점, 미니거상 부위별 등 교육형 라이브 클립이 많습니다.",
    address: "서울특별시 서초구 서초대로 397",
    mapUrl: "https://map.naver.com/v5/search/티에스성형외과",
    phone: "02-532-0000",
    website: "https://www.tsps.co.kr",
    hours: "평일 10:00–19:00",
    highlights: ["라이브 상담", "눈·코", "교육형 콘텐츠"],
    doctors: [
      {
        id: "ts-1",
        name: "안○○",
        title: "대표원장",
        specialties: ["눈", "코", "재수술"],
        photoUrl: DOC.d,
        bio: "티에스TV 진행, 실시간 Q&A 상담.",
        career: ["성형외과 15년"],
      },
    ],
  },
  brown: {
    hospitalId: BROWN_HOSPITAL_ID,
    slug: "brown",
    tagline: "코·윤곽 리얼리티 · 회복기까지",
    introShort: "브라운성형외과는 코·윤곽 수술 리얼리티와 회복기 브이로그로 신뢰를 쌓습니다.",
    introFull: "무보형물 코, 재수술 타이밍, 회복기 브이로그 등 환자 여정 중심 콘텐츠가 특징입니다.",
    address: "서울특별시 강남구 도산대로 123",
    mapUrl: "https://map.naver.com/v5/search/브라운성형외과",
    phone: "02-541-0000",
    website: "https://www.brownps.com",
    hours: "평일 10:00–19:00",
    highlights: ["코·윤곽", "회복 리얼리티", "재수술 Q&A"],
    doctors: [
      {
        id: "brown-1",
        name: "노○○",
        title: "대표원장 · 코성형",
        specialties: ["코", "무보형물", "재수술"],
        photoUrl: DOC.a,
        bio: "기능·미용 동시, 무보형물·재수술 상담.",
        career: ["코성형 16년"],
      },
    ],
  },
};

export function getHospitalProfileById(hospitalId: string): HospitalProfile | undefined {
  return Object.values(HOSPITAL_PROFILES).find((p) => p.hospitalId === hospitalId);
}

export function getHospitalProfileBySlug(slug: string): HospitalProfile | undefined {
  return HOSPITAL_PROFILES[slug.trim().toLowerCase()];
}

export function getHospitalProfileForCatalog(catalog: {
  id: string;
  slug: string;
}): HospitalProfile | undefined {
  return getHospitalProfileById(catalog.id) ?? getHospitalProfileBySlug(catalog.slug);
}

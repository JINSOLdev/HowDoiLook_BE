import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/hash-password.js';
const prisma = new PrismaClient();

async function main() {
  // 초기화
  await prisma.comment.deleteMany({});
  await prisma.curation.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.styleTag.deleteMany({});
  await prisma.styleImage.deleteMany({});
  await prisma.style.deleteMany({});
  await prisma.tag.deleteMany({});
  await prisma.image.deleteMany({});

  // 공통 해시 비밀번호
  const commonPassword = await hashPassword('password1234');

  // 1) 태그 시딩
  // 기존 한글 태그
  const baseTagNames = ['캐주얼', '스트릿', '미니멀', '포멀', '빈티지', '스포티', '러블리', '여름', '겨울', '컬러풀'];
  // 날씨/계절/아이템 태그 (추천 로직에서 사용하는 영문 태그)
  const weatherTagNames = [
    // 온도대
    'linen',
    'short-sleeve',
    'light-fabric',
    'open-toe',
    't-shirt',
    'cotton',
    'wide-pants',
    'sneakers',
    'light-cardigan',
    'shirt',
    'denim',
    'loafers',
    'knit',
    'field-jacket',
    'chinos',
    'sweater',
    'trench',
    'inner-layer',
    'boots',
    'padding',
    'wool-coat',
    'thermal',
    'scarf',

    // 날씨/상황
    'waterproof',
    'hood',
    'goretex',
    'umbrella',
    'windproof',
    'cap',
    'shorter-outer',
    'sunglasses',
    'light-tone',

    // 계절
    'spring',
    'summer',
    'autumn',
    'winter',
  ];

  const allTagNames = [...new Set([...baseTagNames, ...weatherTagNames])];

  await Promise.all(
    allTagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // 2) 이미지 시딩 (기존 10장 그대로 사용)
  const imageUrls = [
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750146858645.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=stnPIB9XI98sgh4vqrG6hRj10ubtrmapoVUQPScSa1lNBx3VsI0LrujekCXG6as4fDjUpp%2BbnNwETbxMDFw7U0SQQJd7jn6GElR1r6NQHD38B8m1JDMwxZOIBHoc66UNb1U94LpDmBc5WyuJBPAd4tGx9aDU5uva8grXSTNHiSg9LQzLoIezW%2FBZNXOHNAVHx%2FqbWnCm4stixhekjPmbXJhQcg5%2F0XWfE8VLoXDHDqvrVoZSQOV2O15JF37D8m%2BQyoFxh7Q9XhFRWmg22R2aw3vDkq99TMdLY%2FSoxI2MiAqFLzVQnfl5arEV2Dn0WjBHWtSHJjcI9Qw7cN8PW6AMeA%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147311122.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=nBP3QWpl2PIokjugWpxYlPI4mnT8mw0BAe3Dsd1HCXq1kja9dfMxE%2BtxUAFg%2BKTD4TXtBw%2FoXrA36Ltf6aQkLOxvXdTV3SXV%2BvdtCPn2DvID7Hw0CzGNX95qiscLyr75DueyZqjuvjkHzFLn5ouQAfTVeVFaSSJZNBFMrjycLB7KlBw9tET6RfK496vr%2B9ZntuXJx8WiYL6C7Tn8CxjRLaONhKE3O8gRj6pDuRChpwdsrR5cipzVUfR8B0h2xtDAOhV4jXBchJgHhZ0P%2BYi6M1Tn75upwlLK%2Fbx4OvWkPnfmH1Incs6ulS4zVtKtVRleOT45lbWZsMDzZlvlLziAEw%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147359056.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=uHkbyHzqzHbqftejC5DjSp2W4Gy%2BlqNLXM43Ijd8QOl4Jfj6Or%2FQDWathfcnC%2BvWDCG27v%2Bc5e2xnpfiGGUGyYbWxfsMYIO2Al6AnWmkUkbhT4WuWYeZ0pJfLXm%2Bz%2Fp83pDKcYFK5tBXSGO2aOkm8l4bNMwJ1o6oMlihZWtkthrbAYBntu9RkE%2FajWhJEPY9dgr3gUDOZdh3u4mMMf%2BjMVpIAHWVv%2BWkKEHnvVmQSOmiC0A0uEc5WNNXCeKNKDgkVr%2BBtugMVBeRTeU042Nz0Qvlvr5zeFvr6L5XJffGMH47xWjn7JcZZQs65tJ7g5HIZABW%2Fi0D7UCgh1DTbKjC3A%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147393368.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=hsorKJjtx%2BLYOCRhmAxgcWKSupyI91cnyxc5Uum%2FRPLXwb9McDH%2Fk2kgOiQ2Uk4O0RE0WYAT2dioJGyAy%2FGMvaC%2BaBfWdGiP2winC6Tw5IghlUSs5oLS1zF6nbFdjG1mQ%2BUr1txQP5JYMVoPc8WQ%2Fu%2BeZwZw%2BLVQu2oHmdQEa9oaiiW2I9nOerc99p%2BQ8KTR1jIkFga721my7pJGyKucKtDeRAjjrp2f3dv2p5ORCU39T0lwy1oulVL9gNyNkAKPKWhy50aP8WpLJlSLB6xU58qWIygfcBR69qvbeMaxg5ASM8IxuTFhnTkaRMruMzciLR5OxWVz17prNkTRngtSaw%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147439907.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=H5cWC0dbtz35Co02wt3M6yoLSTkBKdf8r4DR79ezBRw8FcrCaYUyqUxTFH6CjXiVLu6m8Jz%2FvKaKjSUJhfbd368JWb%2Bo0djz%2FQRXodaB1uuNFER8VHLoBm5GsDIwOugKWf%2Btc%2BEMM5mz1J69qpXT3sIux3FgIX0TcZ5XhWxH1z4glmb10E9RDthjLHXjZeMuNHz3DybpYipmyPojznYGG7JI2BD39bSjRrIQOxn4EZyybDvhzNgxy9oJfmqr64EsTZZOucadxsvIpkYvWopfRUfAmaj%2Bvus55FNN1dla8r3Acu4U%2FEWwGJPSw%2FBZ0UpUGtKdEDzYWB%2B6IkVAwACGhQ%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147475464.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=l%2FuQch2A2SL3xay8Grgxg05M9bWijjsdRJXdxQuHzaMtJED00jPOuGGCAyQqvS5tA8tPruo8jGs8lpP8YfPy2diQIYjH2%2B0kUm9GRsEYBhHda2urLlFAjpReCVTskNd2O1qclbLe1IeT7%2FiDmjMZtyG09f%2BEgXWV%2FiHzui30uAmhavi9oPEAoA%2Bs09QIhpcrI4SJfXtxv7FBURyM%2FggrMKfoVTKYm0fkoOD0C%2FMIUP2CasrzM%2B6VDeClupWB5NAaHzXVvwyw9IFqkovSO7%2FQNT1agONrC%2Fuovm%2BBT490fyinu5UhmQnXBMcKM2CSEi7D%2FWw5n7OymnGYs9hfUh8YgA%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147512146.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=TPl8mMLlHyrVPrJpHQVISLOniMb%2F52npXZanpriGrghRpD3QGIVZqJUC0x3%2BnF0XJ2ejk51GdZG50YB6R1NFIyBPj9Z4Kc45RJm2vYICMwMyGY5EhhAc%2BjWg2%2FeBMZCJTiYjYuJtKXzo%2FvfJnZN%2BuzkHFVUuKypGK6CYH3dZxVwO73yCFT4f1JjdaT7kkj2IzSLj0tNZBFhoF9aGQIVZi21MzoOBwnmfjbWxw10f8V2yo8XyvqVeOrBj8bu8f2l7Yk5jNGFW8cHXiEAXEdvHG6MHxP9gV3xDxNGX0VRIdy%2BL2Oq0hI7dqvxGfyH7%2BBUimR5WDLxlRGh1qOoIklHMdA%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147546378.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=kaW93yM7qSEOD7sb%2BsDwSeHS7G%2Bf%2FOtJMMaO2HEyOSnim3HvD%2BNoW92O%2FcVAlCuS%2FiQnUcJgBdGCLFxc9wy5pkycqAmYTkIRKCyrlLjKvGLI8mbeXya67O8uykkmEYwz42x0ahS4YK721rKQ9Il%2F8ThMy1Rwt39joSTPd2beRuLwBvL1BNCraUDVn57KzRgrPdWy0HsoM%2F8eUAzAZ3WmzXGiVHXBAdv8FiIkygkyhCjD8kSGmAnn2wJPnF%2FqNVS9pj98%2BGrIIv0YFUSPAEZu0cJM1h4GRhwYMcEvFbpHZ%2BPc3FZmHkT2qk349dvwH57AppswYweZraQfO3fd%2FqSIuw%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147696732.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=cGjHyJBJ9mkIJODCzyoX2lfoQwMwngqg76NRO4st6UVITB2yb4U0X%2BkvMrJmIDaIhEKaNfZgoe9udJ1ntuBz2IFD1h9yoMNkkwExSArQ7XL6M99%2FDhBz9x7MgBuRZd8cfshQJ4NzehhDc4cDFODrbScsD4TxAMu44hwm8pthu5hucGx2oOT%2FJxVtg3fHhpNf8O4KHvrYkoru6loPeYcHgxz8mQWbInDlhuW1HQig2sg9hWRZl%2BoNVSLfNBKivywWqtCQTi9feW5vOqyAE0vbgxHhRuwWDhZf6Vxnf0Cbi15CZsUhc%2BUa35vsq73jCDSo3H%2B0SPav4O%2B2WQAUvB5YGg%3D%3D',
    'https://storage.googleapis.com/nb02-how-do-i-look-storage.firebasestorage.app/images/__style_1750147730484.png?GoogleAccessId=firebase-adminsdk-fbsvc%40nb02-how-do-i-look-storage.iam.gserviceaccount.com&Expires=16730323200&Signature=Ya9SiaoE4dzsJ9WZi19RdWfpwzwGo0%2BXKUKZGalJloFSv37kfLlvlzMkB34Yn914MyQWbsoGorOgAvFauG%2BRVA%2FD4SUPyR08YIlpGgv9KJUaO15IHpu1Gi72RIFtMUYZ5bELXliWJayx%2BbeyXoiZEB28xdWCwDJn73%2F9kG%2BDnSeR62AzTYscDML8qlaCnFTa3jlpra6No%2BtC4mioHFpVSsue1laqGk%2Ft97BNSMF1qkDMRinvliiBhKQEFvBK04G2sAQB3lxwfHLqX5X9NjoOjJ%2FEyhVyNFeL9SWHE6jsGXbl2ffRQ9f3FiUg2n250aurj8iTlsvNgPBswasEhA8REQ%3D%3D',
  ];
  const images = await Promise.all(imageUrls.map((url) => prisma.image.create({ data: { imageUrl: url } })));

  // 3) 기존 스타일 10개 시딩 (네가 준 그대로)
  const styleDatas = [
    {
      nickname: '혜원',
      title: '여름 미니멀룩',
      content: '린넨 셔츠와 와이드 슬랙스로 미니멀하게!',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '린넨 셔츠', brand: '무신사', price: 39000n },
        { type: 'BOTTOM', name: '와이드 슬랙스', brand: '코스', price: 79000n },
        { type: 'SHOES', name: '샌들', brand: '버켄스탁', price: 129000n },
      ],
      tagNames: ['미니멀', '여름'],
      imageIdx: [0],
    },
    {
      nickname: '승관',
      title: '빈티지 데님 스타일',
      content: '오버사이즈 청자켓과 찢어진 데님팬츠로 빈티지 무드',
      password: commonPassword,
      categories: [
        { type: 'OUTER', name: '청자켓', brand: '리바이스', price: 99000n },
        { type: 'BOTTOM', name: '데님팬츠', brand: '지오다노', price: 59000n },
      ],
      tagNames: ['빈티지', '캐주얼'],
      imageIdx: [1],
    },
    {
      nickname: '우재',
      title: '포멀 오피스룩',
      content: '블레이저와 슬랙스로 깔끔한 오피스룩',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '블레이저', brand: '자라', price: 99000n },
        { type: 'BOTTOM', name: '슬랙스', brand: '유니클로', price: 59000n },
        { type: 'SHOES', name: '로퍼', brand: '닥터마틴', price: 139000n },
      ],
      tagNames: ['포멀'],
      imageIdx: [2],
    },
    {
      nickname: '미주',
      title: '컬러풀 썸머룩',
      content: '형광 핑크탑과 옐로우 스커트로 톡톡 튀게!',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '네온 핑크탑', brand: 'H&M', price: 19000n },
        { type: 'BOTTOM', name: '옐로우 스커트', brand: '자라', price: 39000n },
      ],
      tagNames: ['컬러풀', '여름', '러블리'],
      imageIdx: [3],
    },
    {
      nickname: '보검',
      title: '스트릿 무드',
      content: '후드집업과 카고팬츠, 볼캡으로 완성!',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '후드집업', brand: '스투시', price: 129000n },
        { type: 'BOTTOM', name: '카고팬츠', brand: '칼하트', price: 99000n },
        { type: 'ACCESSORY', name: '볼캡', brand: '뉴에라', price: 35000n },
      ],
      tagNames: ['스트릿', '캐주얼'],
      imageIdx: [4],
    },
    {
      nickname: '미현',
      title: '러블리 원피스룩',
      content: '플라워 패턴 원피스로 러블리하게',
      password: commonPassword,
      categories: [
        { type: 'DRESS', name: '플라워 원피스', brand: '로엠', price: 49000n },
        { type: 'SHOES', name: '메리제인 슈즈', brand: '바바라', price: 59000n },
      ],
      tagNames: ['러블리', '여름'],
      imageIdx: [5],
    },
    {
      nickname: '영지',
      title: '겨울 코트 스타일',
      content: '로브코트와 니트, 부츠로 따뜻하게!',
      password: commonPassword,
      categories: [
        { type: 'OUTER', name: '로브코트', brand: '코스', price: 159000n },
        { type: 'TOP', name: '울 니트', brand: '탑텐', price: 59000n },
        { type: 'SHOES', name: '롱부츠', brand: '닥터마틴', price: 179000n },
      ],
      tagNames: ['겨울', '포멀'],
      imageIdx: [6],
    },
    {
      nickname: '민규',
      title: '스포티 트레이닝룩',
      content: '트랙탑, 트레이닝팬츠, 스니커즈!',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '트랙탑', brand: '나이키', price: 89000n },
        { type: 'BOTTOM', name: '트레이닝팬츠', brand: '아디다스', price: 69000n },
        { type: 'SHOES', name: '스니커즈', brand: '뉴발란스', price: 99000n },
      ],
      tagNames: ['스포티', '캐주얼'],
      imageIdx: [7],
    },
    {
      nickname: '혜윤',
      title: '모던 가방 포인트룩',
      content: '심플한 블라우스와 컬러백으로 포인트',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '블라우스', brand: '자라', price: 49000n },
        { type: 'BAG', name: '컬러백', brand: '코치', price: 159000n },
      ],
      tagNames: ['미니멀', '컬러풀'],
      imageIdx: [8],
    },
    {
      nickname: '재욱',
      title: '남친룩의 정석',
      content: '셔츠와 슬랙스, 더비슈즈 깔끔하게!',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '셔츠', brand: '무신사', price: 39000n },
        { type: 'BOTTOM', name: '슬랙스', brand: '유니클로', price: 59000n },
        { type: 'SHOES', name: '더비슈즈', brand: '닥터마틴', price: 139000n },
      ],
      tagNames: ['포멀', '캐주얼'],
      imageIdx: [9],
    },
  ];

  // 4) 날씨/계절 추천용 스타일 추가 (영문 태그 중심)
  const weatherStyleDatas = [
    {
      nickname: '장마러',
      title: '워터프루프 라이트 아우터',
      content: '여름 비 오는 날을 위한 경량 방수 아우터 코디',
      password: commonPassword,
      categories: [
        { type: 'OUTER', name: '라이트 방수 자켓', brand: '노스페이스', price: 129000n },
        { type: 'BOTTOM', name: '와이드 팬츠', brand: '유니클로', price: 49000n },
        { type: 'SHOES', name: '고어텍스 스니커즈', brand: '살로몬', price: 179000n },
      ],
      tagNames: ['waterproof', 'hood', 'goretex', 'umbrella', 't-shirt', 'wide-pants', 'sneakers', 'summer'],
      imageIdx: [0],
    },
    {
      nickname: '바람막이',
      title: '강풍 대비 쇼트 아우터',
      content: '바람 강한 날엔 짧은 아우터와 캡으로 체감온도 방어',
      password: commonPassword,
      categories: [
        { type: 'OUTER', name: '윈드프루프 재킷', brand: '나이키', price: 99000n },
        { type: 'ACCESSORY', name: '볼캡', brand: '뉴에라', price: 35000n },
        { type: 'SHOES', name: '스니커즈', brand: '아식스', price: 119000n },
      ],
      tagNames: ['windproof', 'shorter-outer', 'cap', 'sneakers', 'autumn'],
      imageIdx: [1],
    },
    {
      nickname: '한파러',
      title: '한파엔 패딩과 히트텍',
      content: '보온이 최우선인 겨울 한파 코디',
      password: commonPassword,
      categories: [
        { type: 'OUTER', name: '롱 패딩', brand: '디스커버리', price: 259000n },
        { type: 'TOP', name: '히트텍', brand: '유니클로', price: 19900n },
        { type: 'ACCESSORY', name: '머플러', brand: '탑텐', price: 19900n },
      ],
      tagNames: ['padding', 'thermal', 'scarf', 'boots', 'winter'],
      imageIdx: [2],
    },
    {
      nickname: '선글라',
      title: '맑은 날 린넨 셔츠',
      content: '봄/초여름 맑은 날엔 린넨 + 선글라스',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '린넨 셔츠', brand: '코스', price: 69000n },
        { type: 'BOTTOM', name: '치노 팬츠', brand: '무신사', price: 39000n },
        { type: 'ACCESSORY', name: '선글라스', brand: '젠틀몬스터', price: 249000n },
      ],
      tagNames: ['linen', 'shirt', 'light-fabric', 'sunglasses', 'spring'],
      imageIdx: [3],
    },
    {
      nickname: '선선러',
      title: '선선한 날 카디건+데님',
      content: '가벼운 카디건과 데님, 로퍼로 마일드 컨디션 코디',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '라이트 카디건', brand: '자라', price: 49000n },
        { type: 'BOTTOM', name: '데님', brand: '리바이스', price: 99000n },
        { type: 'SHOES', name: '로퍼', brand: '닥터마틴', price: 139000n },
      ],
      tagNames: ['light-cardigan', 'denim', 'loafers', 'mild', 'spring'],
      imageIdx: [4],
    },
    {
      nickname: '가을러',
      title: '가을 니트+트렌치',
      content: '일교차 큰 가을엔 니트와 트렌치, 이너레이어',
      password: commonPassword,
      categories: [
        { type: 'TOP', name: '니트', brand: '탑텐', price: 59000n },
        { type: 'OUTER', name: '트렌치 코트', brand: '무신사', price: 129000n },
        { type: 'ACCESSORY', name: '이너 레이어', brand: '유니클로', price: 19900n },
      ],
      tagNames: ['knit', 'trench', 'inner-layer', 'autumn'],
      imageIdx: [5],
    },
  ];

  // 공통 생성 함수
  async function createStyleWithTagsAndImages(styleData) {
    return prisma.style.create({
      data: {
        nickname: styleData.nickname,
        title: styleData.title,
        content: styleData.content,
        password: styleData.password,
        categories: { create: styleData.categories },
        styleTags: {
          create: await Promise.all(
            styleData.tagNames.map(async (name) => {
              const tag = await prisma.tag.findUnique({ where: { name } });
              return { tagId: tag.tagId };
            })
          ),
        },
        styleImages: {
          create: styleData.imageIdx.map((idx) => ({
            imageId: images[idx % images.length].imageId, // 재사용 가능
          })),
        },
      },
    });
  }

  // 기존 10개 생성
  for (const [i, styleData] of styleDatas.entries()) {
    try {
      const created = await createStyleWithTagsAndImages(styleData);
      console.log(`[base ${i + 1}/10] 스타일 생성 성공:`, created.title);
    } catch (e) {
      console.error(`[base ${i + 1}/10] 스타일 생성 실패`, e);
    }
  }

  // 날씨/계절 6개 생성
  for (const [i, styleData] of weatherStyleDatas.entries()) {
    try {
      const created = await createStyleWithTagsAndImages(styleData);
      console.log(`[weather ${i + 1}/6] 스타일 생성 성공:`, created.title);
    } catch (e) {
      console.error(`[weather ${i + 1}/6] 스타일 생성 실패`, e);
    }
  }

  // 목록 조회 (큐레이션/댓글 연결용)
  const styleList = await prisma.style.findMany({ orderBy: { styleId: 'asc' } });

  // 5) 기존 큐레이션 시딩 (그대로)
  const curationSeeds = [
    {
      styleIdx: 0,
      nickname: '리뷰어A',
      content: '여름에 정말 잘 어울리는 룩이네요!',
      password: commonPassword,
      trendy: 5,
      personality: 4,
      practicality: 5,
      costEffectiveness: 4,
    },
    {
      styleIdx: 0,
      nickname: '리뷰어B',
      content: '미니멀하지만 포인트가 살아있어요',
      password: commonPassword,
      trendy: 4,
      personality: 5,
      practicality: 4,
      costEffectiveness: 5,
    },
    {
      styleIdx: 1,
      nickname: '리뷰어C',
      content: '청자켓 찢어진 데님 조합 최고!',
      password: commonPassword,
      trendy: 3,
      personality: 5,
      practicality: 4,
      costEffectiveness: 3,
    },
    {
      styleIdx: 2,
      nickname: '리뷰어D',
      content: '출근룩 고민 끝났어요!',
      password: commonPassword,
      trendy: 4,
      personality: 3,
      practicality: 5,
      costEffectiveness: 4,
    },
    {
      styleIdx: 3,
      nickname: '리뷰어E',
      content: '컬러 매치 센스가 대박~',
      password: commonPassword,
      trendy: 5,
      personality: 5,
      practicality: 3,
      costEffectiveness: 4,
    },
    {
      styleIdx: 4,
      nickname: '리뷰어F',
      content: '볼캡+카고 조합 킹왕짱!',
      password: commonPassword,
      trendy: 5,
      personality: 4,
      practicality: 4,
      costEffectiveness: 5,
    },
    {
      styleIdx: 5,
      nickname: '리뷰어G',
      content: '꽃무늬 원피스 진짜 예뻐요',
      password: commonPassword,
      trendy: 4,
      personality: 4,
      practicality: 3,
      costEffectiveness: 4,
    },
    {
      styleIdx: 6,
      nickname: '리뷰어H',
      content: '따뜻+스타일 다 잡았네',
      password: commonPassword,
      trendy: 3,
      personality: 3,
      practicality: 5,
      costEffectiveness: 5,
    },
    {
      styleIdx: 7,
      nickname: '리뷰어I',
      content: '운동할 때도 패션을 챙기다니!',
      password: commonPassword,
      trendy: 4,
      personality: 4,
      practicality: 5,
      costEffectiveness: 4,
    },
    {
      styleIdx: 8,
      nickname: '리뷰어J',
      content: '컬러백이 포인트!',
      password: commonPassword,
      trendy: 3,
      personality: 5,
      practicality: 4,
      costEffectiveness: 3,
    },
    {
      styleIdx: 9,
      nickname: '리뷰어K',
      content: '깔끔한 남친룩의 정석',
      password: commonPassword,
      trendy: 5,
      personality: 4,
      practicality: 5,
      costEffectiveness: 4,
    },
  ];

  for (const curation of curationSeeds) {
    const styleId = styleList[curation.styleIdx].styleId;
    await prisma.$transaction([
      prisma.curation.create({
        data: {
          styleId,
          nickname: curation.nickname,
          content: curation.content,
          password: curation.password,
          trendy: curation.trendy,
          personality: curation.personality,
          practicality: curation.practicality,
          costEffectiveness: curation.costEffectiveness,
        },
      }),
      prisma.style.update({
        where: { styleId },
        data: { curationCount: { increment: 1 } },
      }),
    ]);
  }
  console.log('큐레이션 시딩 완료!');

  // 6) 댓글 시딩 (그대로)
  const curationList = await prisma.curation.findMany({ orderBy: { curationId: 'asc' } });
  const commentSeeds = [
    { curationIdx: 0, content: '덥지만 단정하면서 시원해 보이게 신경썼어요', password: commonPassword },
    { curationIdx: 1, content: '시원함과 편안함을 동시에 챙겨봤어요', password: commonPassword },
    { curationIdx: 2, content: '청청패션 좀 과감하죠? 한번 도전해보세요!', password: commonPassword },
    { curationIdx: 3, content: '아묻따 출근룩이죠!', password: commonPassword },
    { curationIdx: 4, content: '처음 도전해보는 색상이예요 어울리나요?', password: commonPassword },
    { curationIdx: 5, content: '힙 해보이나요? 스트릿룩은 처음이라 긴장되네요', password: commonPassword },
    { curationIdx: 6, content: '남자친구랑 데이트할 때 입으려고 준비했어요', password: commonPassword },
    { curationIdx: 7, content: '추워도 스타일은 포기할 수 없죠!', password: commonPassword },
    { curationIdx: 8, content: '운동도 하고 패션도 챙기고 싶었어요', password: commonPassword },
    { curationIdx: 9, content: '모던한 느낌의 가방이 포인트예요', password: commonPassword },
    { curationIdx: 10, content: '여자친구 생기면 남친룩 한번 입어보고 싶었어요', password: commonPassword },
  ];

  for (const [i, comment] of commentSeeds.entries()) {
    try {
      await prisma.comment.create({
        data: {
          curationId: curationList[comment.curationIdx].curationId,
          content: comment.content,
          password: comment.password,
        },
      });
      console.log(`[${i + 1}] 댓글 생성 성공!`);
    } catch (e) {
      console.error(`[${i + 1}] 댓글 생성 실패`, e);
    }
  }
  console.log('댓글(Comment) 시딩 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

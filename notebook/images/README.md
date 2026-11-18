# images

프로젝트 이미지를 이 폴더에 넣고, `index.html`의 `window.PORTFOLIO`에서 경로를 적어 주세요.

```js
sheets: [
  { label: '핵심 화면', image: 'images/mandalart-main.png', text: '설명' },
]
```

상세 보기(9단계)에 이미지를 넣으려면:

```js
detail: { label: 'UX 개선 제안', sections: {
  problem: { text: '문제 정의 설명', images: ['images/oliveyoung-problem.png'] },
} }
```

import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFD6E0',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
        }}
      >
        {/* Crown / tiara shape */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 18h18M5 18l2-8 5 4 5-7 2 11"
            stroke="#7D3050"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="19" cy="7" r="1.5" fill="#C9849A" />
          <circle cx="12" cy="6" r="1.5" fill="#C9849A" />
          <circle cx="5" cy="10" r="1.5" fill="#C9849A" />
        </svg>
      </div>
    ),
    { ...size }
  );
}

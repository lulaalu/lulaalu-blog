'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from '../app/(home)/stores/config-store'
import { CARD_SPACING } from '@/consts'
import MusicSVG from '@/svgs/music.svg'
import PlaySVG from '@/svgs/play.svg'
import { HomeDraggableLayer } from '../app/(home)/home-draggable-layer'
import { Pause, ListMusic } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import musicList from '@/config/music.json'

const MUSIC_TRACKS = musicList.tracks as Array<{ name: string; file: string }>

export default function MusicCard() {
	const pathname = usePathname()
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.musicCard
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard
	const calendarCardStyles = cardStyles.calendarCard

	const [isPlaying, setIsPlaying] = useState(false)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [progress, setProgress] = useState(0)
	const [listOpen, setListOpen] = useState(false)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const currentIndexRef = useRef(0)

	const isHomePage = pathname === '/'

	const position = useMemo(() => {
		if (!isHomePage) {
			return {
				x: center.width - styles.width - 16,
				y: center.height - styles.height - 16
			}
		}

		return {
			x: styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2 - styles.offset,
			y: styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset + CARD_SPACING + calendarCardStyles.height + CARD_SPACING
		}
	}, [isPlaying, isHomePage, center, styles, hiCardStyles, clockCardStyles, calendarCardStyles])

	const { x, y } = position

	useEffect(() => {
		if (!audioRef.current) {
			audioRef.current = new Audio()
		}

		const audio = audioRef.current
		const updateProgress = () => {
			if (audio.duration) {
				setProgress((audio.currentTime / audio.duration) * 100)
			}
		}
		const handleEnded = () => {
			if (MUSIC_TRACKS.length === 0) return
			const nextIndex = (currentIndexRef.current + 1) % MUSIC_TRACKS.length
			currentIndexRef.current = nextIndex
			setCurrentIndex(nextIndex)
			setProgress(0)
		}
		const handleTimeUpdate = () => updateProgress()
		const handleLoadedMetadata = () => updateProgress()

		audio.addEventListener('timeupdate', handleTimeUpdate)
		audio.addEventListener('ended', handleEnded)
		audio.addEventListener('loadedmetadata', handleLoadedMetadata)

		return () => {
			audio.removeEventListener('timeupdate', handleTimeUpdate)
			audio.removeEventListener('ended', handleEnded)
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
		}
	}, [])

	useEffect(() => {
		currentIndexRef.current = currentIndex
		if (audioRef.current) {
			const wasPlaying = !audioRef.current.paused
			audioRef.current.pause()
			audioRef.current.src = MUSIC_TRACKS[currentIndex]?.file || ''
			audioRef.current.loop = false
			setProgress(0)

			if (wasPlaying) {
				audioRef.current.play().catch(console.error)
			}
		}
	}, [currentIndex])

	useEffect(() => {
		if (!audioRef.current) return

		if (isPlaying) {
			audioRef.current.play().catch(console.error)
		} else {
			audioRef.current.pause()
		}
	}, [isPlaying])

	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current.src = ''
			}
		}
	}, [])

	const playTrack = (index: number) => {
		setCurrentIndex(index)
		setIsPlaying(true)
		setListOpen(false)
	}

	const togglePlayPause = () => setIsPlaying(prev => !prev)

	if (MUSIC_TRACKS.length === 0) return null
	if (!isHomePage && !isPlaying) return null

	const track = MUSIC_TRACKS[currentIndex]

	return (
		<HomeDraggableLayer cardKey='musicCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className={clsx('flex items-center gap-3', !isHomePage && 'fixed')}>
				{siteContent.enableChristmas && (
					<>
						<img
							src='/images/christmas/snow-10.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 120, left: -8, top: -12, opacity: 0.8 }}
						/>
						<img
							src='/images/christmas/snow-11.webp'
							alt='Christmas decoration'
							className='pointer-events-none absolute'
							style={{ width: 80, right: -10, top: -12, opacity: 0.8 }}
						/>
					</>
				)}

				<MusicSVG className='h-8 w-8 shrink-0' />

				<div className='min-w-0 flex-1'>
					<div className='text-secondary truncate text-sm'>{track?.name}</div>
					<div className='mt-1 h-2 rounded-full bg-white/60'>
						<div className='bg-linear h-full rounded-full transition-all duration-300' style={{ width: `${progress}%` }} />
					</div>
				</div>

				<div className='flex shrink-0 items-center gap-1.5'>
					<button onClick={togglePlayPause} aria-label='播放/暂停' className='flex h-9 w-9 items-center justify-center rounded-full bg-white transition-opacity hover:opacity-80'>
						{isPlaying ? <Pause className='text-brand h-4 w-4' /> : <PlaySVG className='text-brand ml-0.5 h-4 w-4' />}
					</button>
					<button onClick={() => setListOpen(prev => !prev)} aria-label='播放列表' className={clsx('flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80', listOpen ? 'bg-brand/15' : 'bg-white')}>
						<ListMusic className='text-brand h-4 w-4' />
					</button>
				</div>

				{listOpen && (
					<div className={clsx('absolute z-30 w-[300px] overflow-hidden rounded-xl border bg-white/85 p-1 shadow-lg backdrop-blur', isHomePage ? 'top-full left-0' : 'bottom-full right-0')}>
						<div className='max-h-[200px] overflow-y-auto'>
							{MUSIC_TRACKS.map((t, i) => (
								<button
									key={t.file}
									onClick={() => playTrack(i)}
									className={clsx(
										'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
										i === currentIndex ? 'text-brand bg-brand/10 font-medium' : 'text-secondary hover:bg-white/70 hover:text-primary'
									)}>
									<span className='truncate'>{t.name}</span>
									{i === currentIndex && <span className='ml-auto h-1.5 w-1.5 rounded-full bg-brand' />}
								</button>
							))}
						</div>
					</div>
				)}
			</Card>
		</HomeDraggableLayer>
	)
}

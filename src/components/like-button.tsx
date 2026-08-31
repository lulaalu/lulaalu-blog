'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Heart } from 'lucide-react'
import clsx from 'clsx'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { BLOG_SLUG_KEY } from '@/consts'

type LikeButtonProps = {
	slug?: string
	className?: string
	delay?: number
}

type LikeState = {
	count: number
	lastDate: string
}

const STORAGE_PREFIX = 'lulaalu-likes-'

function todayStr(): string {
	const d = new Date()
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadState(slug: string): LikeState {
	if (typeof window === 'undefined') return { count: 0, lastDate: '' }
	try {
		const raw = window.localStorage.getItem(STORAGE_PREFIX + slug)
		if (!raw) return { count: 0, lastDate: '' }
		const parsed = JSON.parse(raw) as LikeState
		return { count: typeof parsed.count === 'number' ? parsed.count : 0, lastDate: parsed.lastDate || '' }
	} catch {
		return { count: 0, lastDate: '' }
	}
}

function saveState(slug: string, state: LikeState): void {
	try {
		window.localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(state))
	} catch {
		// ignore
	}
}

export default function LikeButton({ slug = 'site', delay, className }: LikeButtonProps) {
	const key = BLOG_SLUG_KEY + slug
	const [show, setShow] = useState(false)
	const [liked, setLiked] = useState(false)
	const [justLiked, setJustLiked] = useState(false)
	const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])
	const [count, setCount] = useState(0)

	useEffect(() => {
		setTimeout(() => setShow(true), delay || 1000)
	}, [delay])

	useEffect(() => {
		const state = loadState(key)
		setCount(state.count)
		setLiked(state.lastDate === todayStr())
	}, [key])

	useEffect(() => {
		if (justLiked) {
			const timer = setTimeout(() => setJustLiked(false), 600)
			return () => clearTimeout(timer)
		}
	}, [justLiked])

	const handleLike = useCallback(() => {
		const today = todayStr()
		const state = loadState(key)
		if (state.lastDate === today) {
			toast('谢谢啦😘，今天已经点过啦💕')
			return
		}

		const next = { count: (state.count || 0) + 1, lastDate: today }
		saveState(key, next)
		setCount(next.count)
		setLiked(true)
		setJustLiked(true)

		const newParticles = Array.from({ length: 6 }, (_, i) => ({
			id: Date.now() + i,
			x: Math.random() * 60 - 30,
			y: Math.random() * 60 - 30
		}))
		setParticles(newParticles)
		setTimeout(() => setParticles([]), 1000)
	}, [key])

	if (show)
		return (
			<motion.button
				initial={{ opacity: 0, scale: 0.6 }}
				animate={{ opacity: 1, scale: 1 }}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				aria-label='Like this post'
				onClick={handleLike}
				className={clsx('card heartbeat-container relative overflow-visible rounded-full p-3', className)}>
				<AnimatePresence>
					{particles.map(particle => (
						<motion.div
							key={particle.id}
							className='pointer-events-none absolute inset-0 flex items-center justify-center'
							initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
							animate={{ opacity: [1, 1, 0], scale: [0, 1.2, 0.8], x: particle.x, y: particle.y }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.8, ease: 'easeOut' }}>
							<Heart className='fill-rose-400 text-rose-400' size={12} />
						</motion.div>
					))}
				</AnimatePresence>

				<motion.span
					initial={{ scale: 0.4 }}
					animate={{ scale: 1 }}
					className={cn(
						'absolute -top-2 left-9 min-w-6 rounded-full px-1.5 py-1 text-center text-xs text-white tabular-nums',
						liked ? 'bg-rose-400' : 'bg-gray-300'
					)}>
					{count}
				</motion.span>

				<motion.div animate={justLiked ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : {}} transition={{ duration: 0.6, ease: 'easeOut' }}>
					<Heart className={clsx('heartbeat', liked ? 'fill-rose-400 text-rose-400' : 'fill-rose-200 text-rose-200')} size={28} />
				</motion.div>
			</motion.button>
		)
}

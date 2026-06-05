import React, { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    let animationFrameId
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 }

    // Particle details
    const particles = []
    const particleCount = 45

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.baseRadius = Math.random() * 1.5 + 0.5
        this.radius = this.baseRadius
        this.alpha = Math.random() * 0.4 + 0.1
        this.color = Math.random() > 0.5 ? '0, 229, 255' : '123, 47, 255' // cyan or violet
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Parallax effect based on mouse distance
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 200) {
          const force = (200 - dist) / 200
          this.x -= dx * force * 0.02
          this.y -= dy * force * 0.02
          this.radius = this.baseRadius * (1 + force * 0.5)
        } else {
          this.radius = this.baseRadius
        }

        // Wrap around boundaries
        if (this.x < 0) this.x = width
        if (this.x > width) this.x = 0
        if (this.y < 0) this.y = height
        if (this.y > height) this.y = 0
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`
        ctx.fill()
      }
    }

    // Light streaks detail
    const lightStreaks = Array.from({ length: 4 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: Math.random() * 0.2 + 0.1,
      length: Math.random() * 200 + 100,
      angle: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.03 + 0.01
    }))

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY

      // Set CSS custom properties on container for CSS-based mesh gradients
      container.style.setProperty('--mouse-x', `${e.clientX}px`)
      container.style.setProperty('--mouse-y', `${e.clientY}px`)
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    const draw = () => {
      // Lerp mouse position for smooth trailing animation
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      ctx.clearRect(0, 0, width, height)

      // Draw light streaks (moving ambient beams)
      lightStreaks.forEach((streak) => {
        streak.x += Math.cos(streak.angle) * streak.speed
        streak.y += Math.sin(streak.angle) * streak.speed

        // Slow change of direction
        if (Math.random() < 0.01) {
          streak.angle = Math.random() * Math.PI * 2
        }

        // Boundaries wrapping for streaks
        if (streak.x < -streak.length) streak.x = width + streak.length
        if (streak.x > width + streak.length) streak.x = -streak.length
        if (streak.y < -streak.length) streak.y = height + streak.length
        if (streak.y > height + streak.length) streak.y = -streak.length

        const grad = ctx.createLinearGradient(
          streak.x,
          streak.y,
          streak.x + Math.cos(streak.angle) * streak.length,
          streak.y + Math.sin(streak.angle) * streak.length
        )
        grad.addColorStop(0, `rgba(0, 229, 255, ${streak.opacity})`)
        grad.addColorStop(0.5, `rgba(123, 47, 255, ${streak.opacity * 0.5})`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.moveTo(streak.x, streak.y)
        ctx.lineTo(
          streak.x + Math.cos(streak.angle) * streak.length,
          streak.y + Math.sin(streak.angle) * streak.length
        )
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      // Update and draw particles
      particles.forEach((p) => {
        p.update()
        p.draw()
      })

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 120) {
            const opacity = (1 - dist / 120) * 0.08
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0, 229, 255, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div ref={containerRef} className="animated-bg pointer-events-none select-none">
      <div className="animated-bg__mesh" />
      <canvas ref={canvasRef} />
    </div>
  )
}

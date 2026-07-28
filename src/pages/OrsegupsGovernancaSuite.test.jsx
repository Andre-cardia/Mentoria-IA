import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrsegupsGovernancaTestePage } from './OrsegupsGovernancaSuite.jsx'

describe('OrsegupsGovernancaTestePage', () => {
  it('separa percentual de finalização da pontuação final', () => {
    render(<OrsegupsGovernancaTestePage />)

    expect(screen.getByText('0/40')).toBeInTheDocument()
    expect(screen.getByText('0% de finalização')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /faltam 40/i })).toBeDisabled()

    const questionCards = Array.from(document.querySelectorAll('.og-question'))
    expect(questionCards).toHaveLength(40)

    questionCards.forEach((card) => {
      const firstOption = card.querySelector('.og-options button')
      fireEvent.click(firstOption)
    })

    expect(screen.getByText('40/40')).toBeInTheDocument()
    expect(screen.getByText('100% de finalização')).toBeInTheDocument()

    const submitButton = screen.getByRole('button', { name: /corrigir teste/i })
    expect(submitButton).not.toBeDisabled()
    fireEvent.click(submitButton)

    expect(screen.getByText('Resultado final')).toBeInTheDocument()
    expect(screen.getByText(/% de aproveitamento/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /teste corrigido/i })).toBeDisabled()
  }, 15000)
})

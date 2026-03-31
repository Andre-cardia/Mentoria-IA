/**
 * Port: contrato que todo gateway de pagamento deve implementar.
 * Trocar de PagBank para outro gateway = criar novo adapter que respeita esta interface.
 *
 * @typedef {Object} CheckoutPlan
 * @property {string} referenceId  - ID único do pedido
 * @property {string} name         - Nome do produto
 * @property {number} amount       - Valor em centavos (ex: 19900 = R$199,00)
 *
 * @typedef {Object} CheckoutResult
 * @property {string} checkoutId
 * @property {string} payLink     - URL de pagamento para redirecionar o usuário
 */

/**
 * @interface IPaymentGateway
 */
export class IPaymentGateway {
  /**
   * Cria um checkout e retorna o link de pagamento.
   * @param {CheckoutPlan} plan
   * @returns {Promise<CheckoutResult>}
   */
  async createCheckout(plan) {
    throw new Error("IPaymentGateway.createCheckout() não implementado");
  }
}

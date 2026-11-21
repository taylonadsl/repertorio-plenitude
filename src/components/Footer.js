import { HeartIcon } from './Icons';

// Para mudar o nome, é só trocar aqui:
export const DEV_NAME = 'Taylon Anderson';

export default function Footer({ className = '' }) {
  return (
    <footer className={`credit ${className}`}>
      <p>
        Site desenvolvido por <strong className="credit-name">{DEV_NAME}</strong>, com o intuito de ajudar cantoras a organizar seus repertórios musicais.
      </p>
      <p>
        Feito com muito amor e carinho <span className="credit-heart"><HeartIcon /></span> para ajudar todos vocês. Obrigado!
      </p>
    </footer>
  );
}

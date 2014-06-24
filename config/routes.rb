Eggcount::Application.routes.draw do
  root to: 'days#index'

  resources :days, only: [:show, :create]

end

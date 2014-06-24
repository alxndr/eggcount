Eggcount::Application.routes.draw do
  root to: 'days#index'

  resources :days, except: :index

end

Eggcount::Application.routes.draw do
  root to: 'days#index'

  resources :days, only: [:show, :create, :edit, :update]

  namespace :api do
    resources :years, only: :index # json
  end

end

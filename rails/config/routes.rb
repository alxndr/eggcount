Eggcount::Application.routes.draw do
  root to: 'days#index'

  resources :days, only: [:create, :edit, :new, :show, :update]

  namespace :api do
    resources :years, only: :index # json
  end

end

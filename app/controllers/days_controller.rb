class DaysController < ApplicationController

  def index
    @days = Day.all.order(:date)
    @day = Day.new
    expires_in 2.minutes, public: true
  end

  def show
    @day = Day.find(params[:id])
  end

  def create
    @day = Day.new(day_params)
    if @day.save
      redirect_to root_path(modified: @day.reload)
    end
  end

  def edit
    @day = Day.find(params[:id])
  end

  def new
    @day = Day.new
  end

  def update
    @day = Day.find(params[:id])
    if @day.update(day_params)
      redirect_to root_path(modified: @day.reload)
    else
      render 'edit'
    end
  end

  private

  def day_params
    params.require(:day).permit(:date, :count)
  end

end

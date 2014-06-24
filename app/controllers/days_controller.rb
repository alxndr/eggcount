class DaysController < ApplicationController

  def index
    @days = Day.all
  end

  def create
    @day = Day.new(day_params)

    @day.save

    redirect_to @day
  end

  def show
    @day = Day.find(params[:id])
  end

  private

  def day_params
    params.require(:day).permit(:date, :count)
  end

end

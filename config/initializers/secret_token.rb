# Be sure to restart your server when you modify this file.

# Your secret key is used for verifying the integrity of signed cookies.
# If you change this key, all old signed cookies will become invalid!

# Make sure the secret is at least 30 characters and all random,
# no regular words or you'll be exposed to dictionary attacks.
# You can use `rake secret` to generate a secure secret key.

# Make sure your secret_key_base is kept private
# if you're sharing your code publicly.
if Rails.env.production? || Rails.env.staging?
  unless ENV["SECRET_TOKEN"]
    abort "No secret token found. Run export SECRET_TOKEN=$(rake secret) before starting server. Aborting"
  end
  Eggcount::Application.config.secret_key_base = ENV["SECRET_TOKEN"]
elsif Rails.env.development? || Rails.env.test?
  token_file = Rails.root.join("config/secret.token")
  unless token_file.exist?
    abort "No config/secret.token file found. Please run 'rake dev:generate_token'. Aborting"
  end
  Eggcount::Application.config.secret_key_base = token_file.read
end
